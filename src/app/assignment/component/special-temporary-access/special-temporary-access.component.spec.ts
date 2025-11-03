import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SpecialTemporaryAccessComponent } from './special-temporary-access.component';

describe('SpecialTemporaryAccessComponent', () => {
  let component: SpecialTemporaryAccessComponent;
  let fixture: ComponentFixture<SpecialTemporaryAccessComponent>;
  CommonTestingModule.setUpTestBed(SpecialTemporaryAccessComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SpecialTemporaryAccessComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecialTemporaryAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
