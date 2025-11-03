import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AddCredentialsComponent } from './add-credentials.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('AddCredentialsComponent', () => {
  let component: AddCredentialsComponent;
  let fixture: ComponentFixture<AddCredentialsComponent>;
  CommonTestingModule.setUpTestBed(AddCredentialsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddCredentialsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCredentialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
