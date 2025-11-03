import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SimpleRowComponent } from './simple-row.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SimpleRowComponent', () => {
  let component: SimpleRowComponent;
  let fixture: ComponentFixture<SimpleRowComponent>;
  CommonTestingModule.setUpTestBed(SimpleRowComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
