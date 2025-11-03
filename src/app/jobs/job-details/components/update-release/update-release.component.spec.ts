import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { UpdateReleaseComponent } from './update-release.component';

describe('UpdateReleaseComponent', () => {
  let component: UpdateReleaseComponent;
  let fixture: ComponentFixture<UpdateReleaseComponent>;
  CommonTestingModule.setUpTestBed(UpdateReleaseComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateReleaseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateReleaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
