import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CustomDataComponent } from './custom-data.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CustomDataComponent', () => {
  let component: CustomDataComponent;
  let fixture: ComponentFixture<CustomDataComponent>;
  CommonTestingModule.setUpTestBed(CustomDataComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
